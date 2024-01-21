import assert from "node:assert";
import { describe, it } from "node:test";
import { AccountUpdate, Bool, Field, MerkleMap, MerkleTree, Mina, Poseidon, PrivateKey, UInt32 } from "o1js";
import { MessageBox } from "./MessageBox.js";

describe('Challange 1 Tests', async () => {
    const LocalBlockchain = Mina.LocalBlockchain({ proofsEnabled: false })
    Mina.setActiveInstance(LocalBlockchain)
    const admin = LocalBlockchain.testAccounts[0]
    const user1 = LocalBlockchain.testAccounts[1]
    const user2 = LocalBlockchain.testAccounts[2]
    const user3 = LocalBlockchain.testAccounts[3]
    const user4 = LocalBlockchain.testAccounts[4]
    const user5 = LocalBlockchain.testAccounts[4]
    const fakeAdmin = LocalBlockchain.testAccounts[5]

    const privateKeyOfContract = PrivateKey.random()

    const addressesMap = new MerkleMap()
    const messagesMap = new MerkleMap()
    const messageBox = new MessageBox(privateKeyOfContract.toPublicKey())

    it("can compile contract", async () => {
        await MessageBox.compile()
    })

    it("can deploy the contract", async () => {
        const tx = await Mina.transaction(admin.publicKey, () => {
            messageBox.deploy()
            AccountUpdate.fundNewAccount(admin.publicKey)
        })
        await tx.prove()
        tx.sign([admin.privateKey, privateKeyOfContract])
        await tx.send()

        const onChainAdmin = messageBox.admin.get()
        const onChainRoot = messageBox.addressesMapRoot.get()
        const onChainCount = messageBox.addressCount.get()
        assert.deepEqual(onChainAdmin, admin.publicKey)
        assert.deepEqual(onChainRoot, addressesMap.getRoot())
        assert.deepEqual(onChainCount, UInt32.from(0))
    })

    it("admin can store an address v1", async () => {
        const user1Hash = Poseidon.hash(user1.publicKey.toFields())

        const tx = await Mina.transaction(admin.publicKey, () => {
            const witness = addressesMap.getWitness(user1Hash)
            messageBox.storeAddress(witness, user1.publicKey)
        })
        await tx.prove()
        tx.sign([admin.privateKey])
        await tx.send()

        addressesMap.set(user1Hash, Bool(true).toField())

        const onChainRoot = messageBox.addressesMapRoot.get()
        const onChainCount = messageBox.addressCount.get()
        assert.deepEqual(onChainRoot, addressesMap.getRoot())
        assert.deepEqual(onChainCount, UInt32.from(1))
    })

    it("admin can store an address v2", async () => {
        const user2Hash = Poseidon.hash(user2.publicKey.toFields())

        const tx = await Mina.transaction(admin.publicKey, () => {
            const witness = addressesMap.getWitness(user2Hash)
            messageBox.storeAddress(witness, user2.publicKey)
        })
        await tx.prove()
        tx.sign([admin.privateKey])
        await tx.send()

        addressesMap.set(user2Hash, Bool(true).toField())

        const onChainRoot = messageBox.addressesMapRoot.get()
        const onChainCount = messageBox.addressCount.get()
        assert.deepEqual(onChainRoot, addressesMap.getRoot())
        assert.deepEqual(onChainCount, UInt32.from(2))
    })

    it("admin can store an address v3", async () => {
        const user3Hash = Poseidon.hash(user3.publicKey.toFields())

        const tx = await Mina.transaction(admin.publicKey, () => {
            const witness = addressesMap.getWitness(user3Hash)
            messageBox.storeAddress(witness, user3.publicKey)
        })
        await tx.prove()
        tx.sign([admin.privateKey])
        await tx.send()

        addressesMap.set(user3Hash, Bool(true).toField())

        const onChainRoot = messageBox.addressesMapRoot.get()
        const onChainCount = messageBox.addressCount.get()
        assert.deepEqual(onChainRoot, addressesMap.getRoot())
        assert.deepEqual(onChainCount, UInt32.from(3))
    })

    it("admin can store an address v3", async () => {
        const user4Hash = Poseidon.hash(user4.publicKey.toFields())

        const tx = await Mina.transaction(admin.publicKey, () => {
            const witness = addressesMap.getWitness(user4Hash)
            messageBox.storeAddress(witness, user4.publicKey)
        })
        await tx.prove()
        tx.sign([admin.privateKey])
        await tx.send()

        addressesMap.set(user4Hash, Bool(true).toField())

        const onChainRoot = messageBox.addressesMapRoot.get()
        const onChainCount = messageBox.addressCount.get()
        assert.deepEqual(onChainRoot, addressesMap.getRoot())
        assert.deepEqual(onChainCount, UInt32.from(4))
    })

    it("admin can't store an address if not signed", async () => {
        const user5Hash = Poseidon.hash(user5.publicKey.toFields())

        try {
            const tx = await Mina.transaction(admin.publicKey, () => {
                const witness = addressesMap.getWitness(user5Hash)
                messageBox.storeAddress(witness, user5.publicKey)
            })
            await tx.prove()
            tx.sign([])
            await tx.send()
            assert(false, "should've failed")
        } catch { }
    })

    it("non-admins can't store an address", async () => {
        const user5Hash = Poseidon.hash(user5.publicKey.toFields())

        try {
            const tx = await Mina.transaction(fakeAdmin.publicKey, () => {
                const addressWitness = addressesMap.getWitness(user5Hash)
                messageBox.storeAddress(addressWitness, user5.publicKey)
            })
            assert(false, "should've failed")
        } catch { }
    })

    it("eligible address can deposit a message v1", async () => {
        const user1Hash = Poseidon.hash(user1.publicKey.toFields())

        const msgBits = Field.empty().toBits() // all bits are false by default
        msgBits[249] = Bool(true)   // 1st flag is true
        const msg = Field.fromBits(msgBits) // constructing a message from bits

        console.log(msgBits.length)

        const tx = await Mina.transaction(user1.publicKey, () => {
            const addressWitness = addressesMap.getWitness(user1Hash)
            const messageWitness = messagesMap.getWitness(user1Hash)
            messageBox.depositMessage(addressWitness, messageWitness, msg)
        })
        await tx.prove()
        tx.sign([user1.privateKey])
        await tx.send()


        messagesMap.set(user1Hash, msg)

        const onChainMessagesRoot = messageBox.messagesMapRoot.get()
        const onChainMessagesCount = messageBox.messageCount.get()
        assert.deepEqual(onChainMessagesRoot, messagesMap.getRoot())
        assert.deepEqual(onChainMessagesCount, UInt32.from(1))
    })

    it("eligible address can deposit a message v2", async () => {
        const user2Hash = Poseidon.hash(user2.publicKey.toFields())

        const msgBits = Field.empty().toBits() // all bits are false by default
        msgBits[250] = Bool(true)   // 2nd flag is true
        msgBits[251] = Bool(true)   // 3rd flag is true
        const msg = Field.fromBits(msgBits) // constructing a message from bits

        const tx = await Mina.transaction(user2.publicKey, () => {
            const addressWitness = addressesMap.getWitness(user2Hash)
            const messageWitness = messagesMap.getWitness(user2Hash)
            messageBox.depositMessage(addressWitness, messageWitness, msg)
        })
        await tx.prove()
        tx.sign([user2.privateKey])
        await tx.send()

        messagesMap.set(user2Hash, msg)

        const onChainMessagesRoot = messageBox.messagesMapRoot.get()
        const onChainMessagesCount = messageBox.messageCount.get()
        assert.deepEqual(onChainMessagesRoot, messagesMap.getRoot())
        assert.deepEqual(onChainMessagesCount, UInt32.from(2))
    })

    it("eligible address can deposit a message v3", async () => {
        const user3Hash = Poseidon.hash(user3.publicKey.toFields())

        const msgBits = Field.empty().toBits() // all bits are false by default
        msgBits[252] = Bool(true)   // 4th flag is true
        const msg = Field.fromBits(msgBits) // constructing a message from bits

        const tx = await Mina.transaction(user3.publicKey, () => {
            const addressWitness = addressesMap.getWitness(user3Hash)
            const messageWitness = messagesMap.getWitness(user3Hash)
            messageBox.depositMessage(addressWitness, messageWitness, msg)
        })
        await tx.prove()
        tx.sign([user3.privateKey])
        await tx.send()

        messagesMap.set(user3Hash, msg)

        const onChainMessagesRoot = messageBox.messagesMapRoot.get()
        const onChainMessagesCount = messageBox.messageCount.get()
        assert.deepEqual(onChainMessagesRoot, messagesMap.getRoot())
        assert.deepEqual(onChainMessagesCount, UInt32.from(3))
    })

    it("eligible address can't deposit a message if flags are mistaken", async () => {
        const user4Hash = Poseidon.hash(user4.publicKey.toFields())

        try {
            const msgBits = Field.empty().toBits() // all bits are false by default
            msgBits[249] = Bool(true)   // 1st flag is true
            msgBits[250] = Bool(true)   // 2nd flag is true (it should have been false)
            const msg = Field.fromBits(msgBits) // constructing a message from bits

            const tx = await Mina.transaction(user1.publicKey, () => {
                const addressWitness = addressesMap.getWitness(user4Hash)
                const messageWitness = messagesMap.getWitness(user4Hash)
                messageBox.depositMessage(addressWitness, messageWitness, msg)
            })
            assert(false, "should've failed")
        } catch { }
    })

    it("ineligible address can't deposit a message", async () => {
        const user5Hash = Poseidon.hash(user5.publicKey.toFields())

        try {
            const msgBits = Field.empty().toBits() // all bits are false by default
            msgBits[249] = Bool(true)   // 1st flag is true
            const msg = Field.fromBits(msgBits) // constructing a message from bits

            const tx = await Mina.transaction(user2.publicKey, () => {
                const addressWitness = addressesMap.getWitness(user5Hash)
                const messageWitness = messagesMap.getWitness(user5Hash)
                messageBox.depositMessage(addressWitness, messageWitness, msg)
            })
            assert(false, "should've failed")
        } catch { }
    })

    it("can check message and depositor v1", async () => {
        const user1Hash = Poseidon.hash(user1.publicKey.toFields())

        const msgBits = Field.empty().toBits() // all bits are false by default
        msgBits[249] = Bool(true)   // 1st flag is true
        const msg = Field.fromBits(msgBits) // constructing a message from bits

        const tx = await Mina.transaction(user5.publicKey, () => {
            const messageWitness = messagesMap.getWitness(user1Hash)
            const isValid = messageBox.checkMessage(messageWitness, user1.publicKey, msg)
            isValid.assertTrue()
        })
        await tx.prove()
        tx.sign([user5.privateKey])
        await tx.send()
    })

    it("can check message and depositor v2", async () => {
        const user2Hash = Poseidon.hash(user2.publicKey.toFields())

        const msgBits = Field.empty().toBits() // all bits are false by default
        msgBits[250] = Bool(true)   // 2nd flag is true
        msgBits[251] = Bool(true)   // 3rd flag is true
        const msg = Field.fromBits(msgBits) // constructing a message from bits

        const tx = await Mina.transaction(user5.publicKey, () => {
            const messageWitness = messagesMap.getWitness(user2Hash)
            const isValid = messageBox.checkMessage(messageWitness, user2.publicKey, msg)
            isValid.assertTrue()
        })
        await tx.prove()
        tx.sign([user5.privateKey])
        await tx.send()
    })

    it("can check message and depositor v3", async () => {
        const user3Hash = Poseidon.hash(user3.publicKey.toFields())

        const msgBits = Field.empty().toBits() // all bits are false by default
        msgBits[252] = Bool(true)   // 4th flag is true
        const msg = Field.fromBits(msgBits) // constructing a message from bits

        const tx = await Mina.transaction(user5.publicKey, () => {
            const messageWitness = messagesMap.getWitness(user3Hash)
            const isValid = messageBox.checkMessage(messageWitness, user3.publicKey, msg)
            isValid.assertTrue()
        })
        await tx.prove()
        tx.sign([user5.privateKey])
        await tx.send()
    })

    it("can't check message and depositor v4", async () => {
        try {
            const user4Hash = Poseidon.hash(user4.publicKey.toFields())

            const msgBits = Field.empty().toBits() // all bits are false by default
            msgBits[250] = Bool(true)   // 1st flag is true
            const msg = Field.fromBits(msgBits) // constructing a message from bits

            const tx = await Mina.transaction(user5.publicKey, () => {
                const messageWitness = messagesMap.getWitness(user4Hash)
                const isValid = messageBox.checkMessage(messageWitness, user4.publicKey, msg)
                isValid.assertTrue()
            })
            await tx.prove()
            tx.sign([user5.privateKey])
            await tx.send()
            assert(false, "should've failed")
        } catch { }
    })
})